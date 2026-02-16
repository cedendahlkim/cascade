# Task: gen-ds-reverse_with_stack-6558 | Score: 100% | 2026-02-13T09:06:23.245189

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

result = []
while stack:
    result.append(stack.pop())

print(*result)