package initialize

import (
	"bufio"
	"groqai2api/global"
	"groqai2api/pkg/accountpool"
	"os"
	"strings"

	groq "github.com/learnLi/groq_client"
)

func InitAuth() {
	var Secrets []*groq.Account
	// Read from SESSION environment variable
	sessionsEnv := os.Getenv("SESSION")
	if sessionsEnv != "" {
		sessionTokens := strings.Split(sessionsEnv, ",")
		for _, token := range sessionTokens {
			trimmedToken := strings.TrimSpace(token)
			if len(trimmedToken) > 0 {
				Secrets = append(Secrets, groq.NewAccount(trimmedToken, ""))
			}
		}
	}
	// Read accounts.txt and create a list of accounts
	if _, err := os.Stat("session_tokens.txt"); err == nil {
		// Each line is a proxy, put in proxies array
		file, _ := os.Open("session_tokens.txt")
		defer file.Close()
		scanner := bufio.NewScanner(file)
		for scanner.Scan() {
			// Split by :
			token := scanner.Text()
			if len(token) == 0 {
				continue
			}
			// Append to accounts
			Secrets = append(Secrets, groq.NewAccount(token, ""))
		}
	}

	global.AccountPool = accountpool.NewAccounts(Secrets)
}
