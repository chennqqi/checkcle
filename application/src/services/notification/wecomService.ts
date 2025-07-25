import { toast } from "@/hooks/use-toast";
import { AlertConfiguration } from "../alertConfigService";
import api from "@/api";

/**
 * Send a notification via WeCom
 */
export async function sendWecomNotification(
  config: AlertConfiguration, 
  message: string,
  status: string
): Promise<boolean> {
  try {
    console.log("====== WECOM NOTIFICATION ATTEMPT ======");
    console.log("Config:", JSON.stringify({
      ...config,
      notify_name: config.notify_name,
      wecom_webhook_url: config.wecom_webhook_url ? "[REDACTED]" : undefined,
      enabled: config.enabled
    }, null, 2));
    
    // Use provided webhook URL
    const webhookUrl = config.wecom_webhook_url;
    
    if (!webhookUrl) {
      console.error("Missing WeChat Work configuration - Webhook URL:", webhookUrl);
      toast({
        title: "Configuration Error",
        description: "Missing WeChat Work webhook URL",
        variant: "destructive"
      });
      return false;
    }

    console.log("Sending WeChat Work notification to webhook URL");
    console.log("Message content:", message);
    
    // Format message for WeChat Work Markdown format
    const formattedMessage = formatWecomMarkdownMessage(message, status);
    
    // Prepare payload for the API call
    const payload = {
      type: "wecom",
      webhookUrl: webhookUrl,
      message: formattedMessage
    };
    
    console.log("Prepared payload for notification:", {
      ...payload,
      webhookUrl: "[REDACTED]"
    });
    
    try {
      // Call our client-side API handler
      console.log("Sending request to /api/realtime endpoint");
      const response = await api.handleRequest('/api/realtime', 'POST', payload);

      console.log("API response status:", response.status);
      console.log("API response data:", JSON.stringify(response.json, null, 2));
      
      // Check if response is ok
      if (response.status !== 200) {
        console.error("Error response from notification API:", response.status);
        toast({
          title: "Notification Failed",
          description: `Server returned error ${response.status}: ${response.json?.description || "Unknown error"}`,
          variant: "destructive"
        });
        return false;
      }
      
      const responseData = response.json;
      
      if (responseData && responseData.ok === false) {
        console.error("Error sending notification:", responseData);
        toast({
          title: "Notification Failed",
          description: responseData.description || "Failed to send notification",
          variant: "destructive"
        });
        return false;
      }

      console.log("Notification sent successfully");
      toast({
        title: "Notification Sent",
        description: "WeChat Work notification sent successfully"
      });
      return true;
    } catch (error) {
      console.error("Error calling notification API:", error);
      toast({
        title: "API Error",
        description: `Failed to communicate with notification service: ${error instanceof Error ? error.message : "Network error"}`,
        variant: "destructive"
      });
      return false;
    }
  } catch (error) {
    console.error("Error in sendWecomNotification:", error);
    toast({
      title: "Notification Error",
      description: `Error sending WeChat Work notification: ${error instanceof Error ? error.message : "Unknown error"}`,
      variant: "destructive"
    });
    return false;
  }
}

/**
 * Format a message for WeChat Work Markdown format
 * 
 * @param message The original message
 * @param status The service status (up, down, warning, etc.)
 * @returns Formatted markdown message for WeChat Work
 */
function formatWecomMarkdownMessage(message: string, status: string): string {
  // Replace newlines with markdown line breaks
  let formattedMessage = message.replace(/\n/g, '\n');
  
  // Extract service name and other details for better formatting
  const serviceNameMatch = message.match(/Service ([^\s]+) is/);
  const serviceName = serviceNameMatch ? serviceNameMatch[1] : "Unknown";
  
  // Extract response time if available
  const responseTimeMatch = message.match(/Response time: ([\d.]+)ms/);
  const responseTime = responseTimeMatch ? responseTimeMatch[1] + "ms" : "N/A";
  
  // Extract URL if available
  const urlMatch = message.match(/URL: ([^\s\n]+)/);
  const url = urlMatch ? urlMatch[1] : "N/A";
  
  // Format the message with markdown
  const markdownMessage = {
    msgtype: "markdown",
    markdown: {
      content: `## <font color=\"${getStatusColor(status)}\">服务状态通知</font>\n\n` +
               `**服务名称**: ${serviceName}\n` +
               `**当前状态**: <font color=\"${getStatusColor(status)}\">${status.toUpperCase()}</font>\n` +
               `**响应时间**: **${responseTime}**\n` +
               `**URL**: **${url}**\n` +
               `**详细信息**: ${formattedMessage}\n` +
               `**通知时间**: **${new Date().toLocaleString()}**`
    }
  };
  
  return JSON.stringify(markdownMessage);
}

/**
 * Get color code based on status
 * 根据用户要求，状态信息根据事件级别用红、绿、蓝三种颜色表示
 */
function getStatusColor(status: string): string {
  const statusLower = status.toLowerCase();
  
  if (statusLower === "up" || statusLower === "resolved" || statusLower === "ok" || statusLower === "operational") {
    return "green"; // 绿色表示正常状态
  } else if (statusLower === "down" || statusLower === "error" || statusLower === "critical") {
    return "red"; // 红色表示错误或严重问题
  } else if (statusLower === "warning" || statusLower === "degraded" || statusLower === "maintenance" || statusLower === "paused") {
    return "blue"; // 蓝色表示警告或降级状态
  } else {
    return "gray"; // 灰色表示其他状态
  }
}

/**
 * Test sending a WeChat Work notification
 * This function is used for testing the WeChat Work notification configuration
 * 
 * @param config The alert configuration containing WeChat Work webhook URL
 * @param serviceName The name of the service to include in the test message
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function testSendWecomMessage(
  config: AlertConfiguration,
  serviceName: string = "Test Service"
): Promise<boolean> {
  try {
    console.log("====== TEST WECOM NOTIFICATION ======");
    console.log("Sending test notification to WeChat Work");
    
    // Create a test message
    const testMessage = `🧪 这是一条测试消息\nService ${serviceName} is UP\nResponse time: 123ms\nURL: https://example.com\n\n此消息仅用于测试企业微信通知配置。`;
    
    // Send the notification with "up" status for testing
    return await sendWecomNotification(config, testMessage, "up");
  } catch (error) {
    console.error("Error in testSendWecomMessage:", error);
    toast({
      title: "测试通知失败",
      description: `发送企业微信测试通知时出错: ${error instanceof Error ? error.message : "未知错误"}`,
      variant: "destructive"
    });
    return false;
  }
}