import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, AlertCircle, CheckCircle, Loader2, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertConfiguration } from "@/services/alertConfigService";
import { testSendWecomMessage } from "@/services/notification/wecomService";

interface TestWecomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: AlertConfiguration | null;
}

const TestWecomDialog: React.FC<TestWecomDialogProps> = ({
  open,
  onOpenChange,
  config
}) => {
  const [serviceName, setServiceName] = useState('测试服务');
  const [isTesting, setIsTesting] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSend = async () => {
    if (!config) {
      toast({
        title: "配置错误",
        description: "无法获取企业微信配置信息",
        variant: "destructive",
      });
      return;
    }
    
    if (!config.wecom_webhook_url) {
      toast({
        title: "配置错误",
        description: "请先设置企业微信 Webhook URL",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLastResult(null);
      setIsTesting(true);
      
      console.log('发送企业微信测试消息:', {
        serviceName,
        webhookUrl: config.wecom_webhook_url ? "[已隐藏]" : undefined
      });
      
      const result = await testSendWecomMessage(config, serviceName);
      
      if (result) {
        setLastResult({
          success: true,
          message: `测试消息已成功发送到企业微信`
        });
        
        toast({
          title: "发送成功",
          description: `测试消息已成功发送到企业微信`,
          variant: "default",
        });
      } else {
        setLastResult({
          success: false,
          message: "发送测试消息失败，请检查配置和网络连接"
        });
        
        toast({
          title: "发送失败",
          description: "发送测试消息失败，请检查配置和网络连接",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('发送企业微信测试消息出错:', error);
      const errorMessage = error instanceof Error ? error.message : "发送测试消息失败";
      
      setLastResult({
        success: false,
        message: errorMessage
      });
      
      toast({
        title: "错误",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // 重置表单但保留上次结果以供参考
    setServiceName('测试服务');
    // 不立即重置lastResult，以便用户查看结果
    setTimeout(() => setLastResult(null), 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            发送企业微信测试消息
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={handleClose}
            disabled={isTesting}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* 显示上次结果 */}
          {lastResult && (
            <Alert variant={lastResult.success ? "default" : "destructive"}>
              {lastResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {lastResult.message}
              </AlertDescription>
            </Alert>
          )}

          {/* 服务名称 */}
          <div className="space-y-2">
            <Label>服务名称</Label>
            <Input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="输入服务名称"
              disabled={isTesting}
            />
          </div>

          {/* 信息提示 */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              这将使用您配置的企业微信 Webhook URL 发送测试消息。请确保已正确配置企业微信机器人。
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleClose} disabled={isTesting}>
            关闭
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={!config?.wecom_webhook_url || isTesting}
            className="flex items-center gap-2"
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
            {isTesting ? "发送中..." : "发送测试消息"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TestWecomDialog;