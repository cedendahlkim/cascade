# Task: gen-ds-reverse_with_stack-6443 | Score: 100% | 2026-02-12T13:01:59.751199

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

print(' '.join(stack[::-1]))