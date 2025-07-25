package middlewares

import (
	"groqai2api/global"
	"strings"

	"github.com/gin-gonic/gin"
)

func Authorization(c *gin.Context) {
	if global.Password != "" {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		if global.Password != strings.Replace(authHeader, "Bearer ", "", 1) {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}
	}
	c.Next()
}
