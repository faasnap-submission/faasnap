import { useEffect, useState } from 'react';
import './App.css';
import { Button, ButtonGroup, Col, Container, Form, Modal, Nav, Navbar, Row, Table } from 'react-bootstrap';

type Function = {
  name: string
  kernel: string
  image: string
}

type Config = {
  images: Record<string, string>
  kernels: Record<string, string>
}

type Vm = {
  vmId: string
  function: string
  state: string
  socket: string
  net: {
    address: string
    mac: string
    device: string
  }
  vmConf: {
    bootSource: {
      kernelImagePath: string
      bootArgs: string
    }
    drives: {
      driveId: string
      pathOnHost: string
      isRootDevice: boolean
      isReadOnly: boolean
    }[]
    machineConfig: {
      vcpuCount: number
      memSizeMib: number
      htEnabled: boolean
      trackDirtyPages: boolean
    }
    networkInterfaces: {
      ifaceId: string
      guestMac: string
      hostDevName: string
    }[]
  }
  vmPath: string
}

type Snapshot = {
  snapshotId: string
  function: string
  snapshotPath: string
  memFilePath: string
  functionVersion: string
  size: number
  mincore: boolean[]
}

type DaemonState = {
  functionManager: {
    functions: Record<string, Function>
    config: Config
  }
  vmController: {
    machines: Record<string, Vm>
  },
  snapshotManager: {
    snapshots: Record<string, Snapshot>
  }
}

function App() {
  const [err, setError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [data, setData] = useState({} as DaemonState)

  useEffect(() => {
    setIsLoaded(false)
    fetch("/ui/data")
      .then(res => {
        return res.json()
      })
      .then(
        (result) => {
          setData(result);
          setIsLoaded(true);
        },
        (error) => {
          console.log(error)
          setError(true);
          setIsLoaded(true);
        }
      )
      .catch((e) => {
        console.log(e)
        setIsLoaded(false);
        setError(true);
      });
  }, []);

  if (err) {
    return (
      <div>Error: failed to load data</div>
    );
  } else if (!isLoaded) {
    return (
      <div>Loading...</div>
    );
  } else {

    return (
      <div className="App">
        <Container>
          <TopBar {...data} />
          <Row>
            <Col>
              <h3>μVM Functions</h3>
              <FnController {...data} />
            </Col>
          </Row>
          <Row>
            <Col>
              <h3>μVMs</h3>
              <VmController {...data} />
            </Col>
          </Row>
          <Row>
            <Col>
              <h3>Snapshots</h3>
              <SnapshotController {...data} />
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}

function TopBar(state: DaemonState) {
  return (
    <Navbar bg="light" expand="lg" sticky="top">
      <Navbar.Brand href="#home">SnapFaaS</Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="responsive-navbar-nav">
        <Nav className="mr-auto">
          <Nav.Link href={`${window.location.hostname}:9411`}>Zipkin</Nav.Link>
        </Nav>
        <Nav>
          <CreateFunction {...state} />
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}

function SnapshotController(data: DaemonState) {
  const snapTable = []
  for (let k in data.snapshotManager.snapshots) {
    let snap: Snapshot = data.snapshotManager.snapshots[k]
    snapTable.push((
      <tr key={snap.function}>
        <td>{snap.function}</td>
        <td>{snap.memFilePath}</td>
        <td>{snap.mincore}</td>
        <td>{snap.size}</td>
        <td>{snap.snapshotId}</td>
        <td>{snap.snapshotPath}</td>
        <td>{snap.functionVersion}</td>
        <td>
          <ButtonGroup>
          <XHRButton text="load" url={`/load?ssID=${snap.snapshotId}`} />
          </ButtonGroup>
        </td>
      </tr>
    ))
  }
  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          <th>function</th>
          <th>memFilePath</th>
          <th>mincore</th>
          <th>size</th>
          <th>snapshot id</th>
          <th>snapshot path</th>
          <th>snapshot version</th>
          <th>controls</th>
        </tr>
      </thead>
      <tbody>
        {snapTable}
      </tbody>
    </Table>
  );
}

function CreateFunction(data: DaemonState) {
  const [show, setShow] = useState(false);
  const [kernel, setKernel] = useState(Object.keys(data.functionManager.config.kernels)[0])
  const [image, setImage] = useState(Object.keys(data.functionManager.config.images)[0])
  const [func, setFunc] = useState("")

  const handleClose = () => {
    setShow(false)
  };
  const handleShow = () => setShow(true);
  const createVm = function (func: string, kernel: string, image: string) {
    const url = `/create?function=${func}&kernel=${kernel}&image=${image}`
    fetch(url).then((resp) => {
      window.location.assign("#function")
      handleClose()
      window.location.reload()
    },
      (err) => {
        console.log("failed to create new VM: " + err)
      }
    )
  };

  const handleSubmit = (event: any) => {
    event.preventDefault()
    createVm(func, kernel, image)
  }

  let kernelList = []
  for (let kern in data.functionManager.config.kernels) {
    kernelList.push(kern)
  }
  let kernelOptions = kernelList.map(x => (<option value={x}>{x}</option>))

  var imageList = []
  for (let img in data.functionManager.config.images) {
    imageList.push(img)
  }
  let imgOptions = imageList.map(x => (<option value={x}>{x}</option>))

  return (
    <>
      <Button variant="outline-primary" onClick={handleShow}>
        + Function
      </Button>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Create new microVM</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="kernelImage">
              <Form.Label>VM Kernel</Form.Label>
              <Form.Control as="select" onChange={e => setKernel(e.target.value)}>
                {kernelOptions}
              </Form.Control>
            </Form.Group>
            <Form.Group controlId="imageName">
              <Form.Label>Filesystem Image</Form.Label>
              <Form.Control as="select" onChange={e => setImage(e.target.value)}>
                {imgOptions}
              </Form.Control>
            </Form.Group>
            <Form.Group controlId="functionName">
              <Form.Label>VM Function Name</Form.Label>
              <Form.Control type="textbox" placeholder="function name" onChange={e => setFunc(e.target.value)} />
            </Form.Group>
            <Button variant="secondary" type="submit">
              Create
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}

type XHRProps = {
  url: string
  text: string
}
function XHRButton(props: XHRProps) {
  const clk = () => {
    fetch(props.url).then(() => window.location.reload())
  }
  return (
    <Button variant="outline-primary" onClick={clk}>
      {props.text}
    </Button>
  )
}

function FnController(data: DaemonState) {
  const fnTable = []
  for (let k in data.functionManager.functions) {
    let fn: Function = data.functionManager.functions[k]
    fnTable.push((
      <tr key={fn.name}>
        <td>{fn.name}</td>
        <td>{fn.kernel}</td>
        <td>{fn.image}</td>
        <td>
          <ButtonGroup>
            <XHRButton url={`/start?function=${fn.name}`} text="new VM" />
            <XHRButton url={`/invoke?function=${fn.name}`} text="invoke" />
          </ButtonGroup>
        </td>
      </tr>
    ))
  }
  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          <th>Function Name</th>
          <th>Kernel Image</th>
          <th>FS Image</th>
          <th>Controls</th>
        </tr>
      </thead>
      <tbody>
        {fnTable}
      </tbody>
    </Table>
  );
}

function VmController(data: DaemonState) {
  const vmTable = []
  for (let k in data.vmController.machines) {
    let vm: Vm = data.vmController.machines[k]
    vmTable.push((
      <tr key={vm.vmId}>
        <td>{vm.vmId}</td>
        <td>{vm.function}</td>
        <td>{vm.state}</td>
        <td><VmDetailModal {...vm} /></td>
        <td>
          <ButtonGroup>
            <XHRButton text="invoke" url={`/invoke?vmID=${vm.vmId}`} />
            <XHRButton text="stop" url={`/stop?vmID=${vm.vmId}`} />
            <XHRButton text="snapshot diff" url={`/snapshot?vmID=${vm.vmId}`} />
            <XHRButton text="snapshot full" url={`/snapshot?vmID=${vm.vmId}&snapshot_type=Diff`} />
            <VmDmesgModal {...vm} />
          </ButtonGroup>
        </td>
      </tr>
    ))
  }
  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          <th>VM ID</th>
          <th>Function</th>
          <th>State</th>
          <th>Details</th>
          <th>Controls</th>
        </tr>
      </thead>
      <tbody>
        {vmTable}
      </tbody>
    </Table>
  );
}

function VmDmesgModal(vm: Vm) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [show, setShow] = useState(false);
  const [dmesg, setDmesg] = useState("")
  const [error, setError] = useState("")
  const handleClose = () => setShow(false)
  const handleShow = () => {
    setShow(true)
    setIsLoaded(false)
    fetch(`/dmesg?vmID=${vm.vmId}`)
      .then((result) => result.text())
      .then(
        (result) => {
          setDmesg(result);
          setIsLoaded(true);
        },
        (error) => {
          setError(error.message);
          setIsLoaded(true);
        }
      )
      .catch((e) => {
        setIsLoaded(false);
        setError(e.message);
      });
  }

  let content = ""
  if (!isLoaded) {
    content = "Loading dmesg output..."
  } else if (error !== "") {
    content = error
  } else {
    content = dmesg
  }
  return (
    <>
      <Button variant="outline-primary" onClick={handleShow}>
        dmesg
      </Button>

      <Modal size="lg" show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>VM {vm.vmId} Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <pre>
            {content}
          </pre>
        </Modal.Body>
      </Modal>
    </>
  );
}

function VmDetailModal(vm: Vm) {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <Button variant="outline-primary" onClick={handleShow}>
        Details
      </Button>

      <Modal size="xl" show={show} className=".vm-detail" onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>VM {vm.vmId} Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table>
            <tbody>
              <tr>
                <th>ID</th>
                <td>{vm.vmId}</td>
              </tr>
              <tr>
                <th>function</th>
                <td>{vm.function}</td>
              </tr>
              <tr>
                <th>net</th>
                <td><pre>{JSON.stringify(vm.net, null, 2)}</pre></td>
              </tr>
              <tr>
                <th>socket</th>
                <td>{vm.socket}</td>
              </tr>
              <tr>
                <th>state</th>
                <td>{vm.state}</td>
              </tr>
              <tr>
                <th>configuration</th>
                <td><pre>{JSON.stringify(vm.vmConf, null, 2)}</pre></td>
              </tr>
            </tbody>
          </Table>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default App;
