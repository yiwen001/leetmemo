'use client'

import { useState } from 'react'
import { Form, Input, Button } from 'antd'
import styles from './AddProblemForm.module.scss'

const { TextArea } = Input

interface AddProblemFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
  loading: boolean
}

export default function AddProblemForm({ onSubmit, onCancel, loading }: AddProblemFormProps) {
  const [form] = Form.useForm()

  const handleSubmit = (values: any) => {
    onSubmit(values)
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      className={styles.form}
    >
      <Form.Item
        name="url"
        label="LeetCode链接"
        rules={[
          { required: true, message: '请输入LeetCode链接' },
          { type: 'url', message: '请输入有效的URL' }
        ]}
      >
        <Input 
          placeholder="https://leetcode.com/problems/two-sum/" 
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="notes"
        label="笔记（可选）"
      >
        <TextArea 
          rows={4} 
          placeholder="记录你的解题思路、代码、注意事项等..." 
          size="large"
        />
      </Form.Item>

      <Form.Item className={styles.formActions}>
        <Button onClick={onCancel} size="large" style={{ marginRight: 12 }}>
          取消
        </Button>
        <Button type="primary" htmlType="submit" loading={loading} size="large">
          添加题目
        </Button>
      </Form.Item>
    </Form>
  )
}