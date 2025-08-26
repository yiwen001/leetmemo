// components/CreatePlanModal.tsx
'use client'

import { useState } from 'react'
import { Modal, Form, Input, Select, DatePicker, InputNumber, message } from 'antd'
import { Plus, Trash2 } from 'lucide-react'
import dayjs from 'dayjs'

interface Problem {
  name: string
  url: string
}

interface CreatePlanModalProps {
  open: boolean
  onCancel: () => void
  onSubmit: (planData: any) => void
  loading: boolean
}

export default function CreatePlanModal({ open, onCancel, onSubmit, loading }: CreatePlanModalProps) {
  const [form] = Form.useForm()
  const [problems, setProblems] = useState<Problem[]>([
    { name: '', url: '' }
  ])

  const addProblem = () => {
    setProblems([...problems, { name: '', url: '' }])
  }

  const removeProblem = (index: number) => {
    if (problems.length > 1) {
      setProblems(problems.filter((_, i) => i !== index))
    }
  }

  const updateProblem = (index: number, field: 'name' | 'url', value: string) => {
    const newProblems = [...problems]
    newProblems[index][field] = value
    setProblems(newProblems)
  }

  const handleSubmit = (values: any) => {
    const validProblems = problems.filter(p => p.name.trim() && p.url.trim())
    
    if (validProblems.length === 0) {
      message.error('请至少添加一道题目')
      return
    }

    const planData = {
      ...values,
      problems: validProblems,
      startDate: values.startDate.format('YYYY-MM-DD')
    }

    onSubmit(planData)
  }

  const handleCancel = () => {
    form.resetFields()
    setProblems([{ name: '', url: '' }])
    onCancel()
  }

  return (
    <Modal
      title="创建学习计划"
      open={open}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={700}
      okText="创建计划"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          duration: 30,
          intensity: 'medium',
          startDate: dayjs()
        }}
      >
        <Form.Item
          name="name"
          label="计划名称"
          rules={[{ required: true, message: '请输入计划名称' }]}
        >
          <Input placeholder="例如：LeetCode 基础算法" />
        </Form.Item>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item
            name="duration"
            label="学习天数"
            rules={[{ required: true, message: '请输入学习天数' }]}
            style={{ flex: 1 }}
          >
            <InputNumber min={1} max={365} placeholder="30" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="intensity"
            label="学习强度"
            rules={[{ required: true, message: '请选择学习强度' }]}
            style={{ flex: 1 }}
          >
            <Select>
              <Select.Option value="easy">轻松 (每日2-3题)</Select.Option>
              <Select.Option value="medium">中等 (每日3-4题)</Select.Option>
              <Select.Option value="hard">高强度 (每日4-5题)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="startDate"
            label="开始日期"
            rules={[{ required: true, message: '请选择开始日期' }]}
            style={{ flex: 1 }}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <Form.Item label="题目列表">
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {problems.map((problem, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <Input
                  placeholder="题目名称"
                  value={problem.name}
                  onChange={(e) => updateProblem(index, 'name', e.target.value)}
                  style={{ flex: 2 }}
                />
                <Input
                  placeholder="LeetCode 链接"
                  value={problem.url}
                  onChange={(e) => updateProblem(index, 'url', e.target.value)}
                  style={{ flex: 3 }}
                />
                <button
                  type="button"
                  onClick={() => removeProblem(index)}
                  disabled={problems.length === 1}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: problems.length === 1 ? '#ccc' : '#ff4d4f',
                    cursor: problems.length === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          
          <button
            type="button"
            onClick={addProblem}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              border: '1px dashed #d9d9d9',
              background: 'transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              width: '100%',
              justifyContent: 'center',
              marginTop: '8px'
            }}
          >
            <Plus size={16} />
            添加题目
          </button>
        </Form.Item>
      </Form>
    </Modal>
  )
}