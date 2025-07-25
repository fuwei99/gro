package groq

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"

	http "github.com/bogdanfinn/fhttp"
	tls_client "github.com/bogdanfinn/tls-client"
	groq "github.com/learnLi/groq_client"
)

func baseHeader() http.Header {
	header := http.Header{}
	header.Set("accept", "*/*")
	header.Set("accept-language", "zh-CN,zh;q=0.9")
	header.Set("content-type", "application/json")
	header.Set("origin", "https://console.groq.com")
	header.Set("referer", "https://console.groq.com/")
	header.Set("sec-ch-ua", `"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"`)
	header.Set("sec-ch-ua-mobile", "?0")
	header.Set("sec-ch-ua-platform", `"Windows"`)
	header.Set("sec-fetch-dest", "empty")
	header.Set("sec-fetch-mode", "cors")
	header.Set("sec-fetch-site", "same-site")
	header.Set("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36")
	return header
}
func GerOrganizationId(client tls_client.HttpClient, api_key string, proxy string) (string, error) {
	header := baseHeader()

	if proxy != "" {
		client.SetProxy(proxy)
	}
	req, err := http.NewRequest(http.MethodGet, "https://api.groq.com/platform/v1/user/profile", nil)
	header.Set("authorization", "Bearer "+api_key)
	req.Header = header
	if err != nil {
		return "", err
	}
	response, err := client.Do(req)
	if err != nil {
		return "", err
	}
	if response.StatusCode != 200 {
		return "", errors.New("response status code is not 200")
	}
	var result groq.Profile
	err = json.NewDecoder(response.Body).Decode(&result)
	if err != nil {
		return "", err
	}
	return result.User.Orgs.Data[0].Id, nil
}

func GetSessionToken(client tls_client.HttpClient, api_key string, proxy string) (groq.AuthenticateResponse, error) {
	if proxy != "" {
		client.SetProxy(proxy)
	}
	if api_key == "" {
		return groq.AuthenticateResponse{}, errors.New("session token is empty")
	}
	authorization := generateRefreshToken(api_key)
	header := baseHeader()
	header.Set("authorization", "Basic "+authorization)
	header.Set("x-sdk-client", "eyJldmVudF9pZCI6ImV2ZW50LWlkLTRiOGY2ZjllLWZiMzktNGQwMi04ZTdkLTQ0ZmZkODQxMGQ4NiIsImFwcF9zZXNzaW9uX2lkIjoiYXBwLXNlc3Npb24taWQtZmQ3ZmMzMzgtOGEwOC00Mzc5LWI3ODMtNjFjYjczOTIyNDM3IiwicGVyc2lzdGVudF9pZCI6InBlcnNpc3RlbnQtaWQtYThjOTkxOTQtOTcwNi00Nzk2LTg0ZGUtZDM5MTIyMzFlNTA3IiwiY2xpZW50X3NlbnRfYXQiOiIyMDI1LTA3LTI1VDA3OjAwOjQzLjkyOFoiLCJ0aW1lem9uZSI6IkFzaWEvU2hhbmdoYWkiLCJzdHl0Y2hfdXNlcl9pZCI6InVzZXItbGl2ZS01NTc2MTIyYi00OTdhLTQ0ZmEtYTY1Zi01NTAzYmI3OTgzODUiLCJzdHl0Y2hfc2Vzc2lvbl9pZCI6InNlc3Npb24tbGl2ZS00ZmRiMWViYi1iNTg5LTRiMzctODkxMy0zM2E4ZTczNTAzMGMiLCJhcHAiOnsiaWRlbnRpZmllciI6ImNvbnNvbGUuZ3JvcS5jb20ifSwic2RrIjp7ImlkZW50aWZpZXIiOiJTdHl0Y2guanMgSmF2YXNjcmlwdCBTREsiLCJ2ZXJzaW9uIjoiNS4yNC42In19")
	header.Set("x-sdk-parent-host", "https://console.groq.com")
	header.Set("sec-fetch-site", "cross-site")

	rawUrl := "https://api.stytch.com/sdk/v1/sessions/authenticate"
	req, err := http.NewRequest(http.MethodPost, rawUrl, strings.NewReader(`{}`))
	req.Header = header
	if err != nil {
		return groq.AuthenticateResponse{}, err
	}
	response, err := client.Do(req)
	if err != nil {
		return groq.AuthenticateResponse{}, err
	}
	if response.StatusCode != 200 {
		return groq.AuthenticateResponse{}, errors.New("authenticate failed")
	}
	var result groq.AuthenticateResponse
	err = json.NewDecoder(response.Body).Decode(&result)
	if err != nil {
		return groq.AuthenticateResponse{}, err
	}
	return result, nil
}

func generateRefreshToken(api_key string) string {
	prefix := "public-token-live-26a89f59-09f8-48be-91ff-ce70e6000cb5:" + api_key
	return base64.StdEncoding.EncodeToString([]byte(prefix))
}
func ChatCompletions(client tls_client.HttpClient, api_request groq.APIRequest, api_key string, organization string, proxy string) (*http.Response, error) {
	if proxy != "" {
		client.SetProxy(proxy)
	}
	body_json, _ := json.Marshal(api_request)
	header := baseHeader()
	header.Set("authorization", "Bearer "+api_key)
	header.Set("groq-organization", organization)
	//response, err := client.Request("POST", "https://api.groq.com/openai/v1/chat/completions", header, nil, bytes.NewBuffer(body_json))
	req, err := http.NewRequest(http.MethodPost, "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(body_json))
	req.Header = header
	if err != nil {
		return nil, err
	}
	response, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	if response.StatusCode != 200 {

		return nil, errors.New("response status code is not 200")
	}
	return response, nil
}
func GetModels(client tls_client.HttpClient, api_key string, organization string, proxy string) (*http.Response, error) {
	header := baseHeader()
	header.Set("authorization", "Bearer "+api_key)
	header.Set("groq-organization", organization)
	if proxy != "" {
		client.SetProxy(proxy)
	}
	req, err := http.NewRequest(http.MethodGet, "https://api.groq.com/openai/v1/models", nil)
	//response, err := client.Request("GET", "https://api.groq.com/openai/v1/models", header, nil, nil)
	req.Header = header
	if err != nil {
		return nil, err
	}
	response, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	if response.StatusCode != 200 {
		return nil, errors.New("response status code is not 200")
	}
	return response, nil
}
