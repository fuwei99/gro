package global

import (
	"groqai2api/pkg/accountpool"
	"groqai2api/pkg/proxypool"

	"github.com/patrickmn/go-cache"
)

var (
	Cache       *cache.Cache
	Host        string
	Port        string
	ChinaPrompt string
	ProxyPool   *proxypool.IProxy
	Password    string
	AccountPool *accountpool.IAccounts
)
