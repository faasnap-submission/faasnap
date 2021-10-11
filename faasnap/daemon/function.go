package daemon

import (
	"errors"
	"fmt"
	"sync"

	log "github.com/sirupsen/logrus"
)

type Function struct {
	Name    string `json:"name"`
	Kernel  string `json:"kernel"`
	Image   string `json:"image"`
	Vcpu    int    `json:"vcpu"`
	MemSize int    `json:"memSize"`
}

type FunctionManager struct {
	sync.Mutex
	Functions map[string]*Function `json:"functions"`
	config    *Config
}

func NewFunctionManager(config *Config) *FunctionManager {
	return &FunctionManager{
		Functions: map[string]*Function{},
		config:    config,
	}
}

func (fm *FunctionManager) CreateFunction(name string, kernel string, image string, vcpu, memSize int) error {
	fm.Lock()
	defer fm.Unlock()

	// verify image
	if _, ok := fm.Functions[name]; ok {
		log.Error("function exists")
		return errors.New("function exists")
	}

	if kernel == "" || image == "" {
		return fmt.Errorf("kernel and image must both be populated")
	}

	imagePath, ok := fm.config.Images[image]
	if !ok {
		return fmt.Errorf("could not find image with alias %v", image)
	}
	kernelPath, ok := fm.config.Kernels[kernel]
	if !ok {
		return fmt.Errorf("could not find kernel with alias %v", kernel)
	}

	if vcpu == 0 {
		vcpu = 2
	}
	if memSize == 0 {
		memSize = 2048
	}
	newFunc := &Function{
		Name:    name,
		Kernel:  kernelPath,
		Image:   imagePath,
		Vcpu:    vcpu,
		MemSize: memSize,
	}

	log.Println("adding function:", *newFunc)

	fm.Functions[name] = newFunc
	return nil
}
