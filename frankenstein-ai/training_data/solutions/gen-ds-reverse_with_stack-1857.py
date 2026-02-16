# Task: gen-ds-reverse_with_stack-1857 | Score: 100% | 2026-02-12T14:04:55.028148

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

print(' '.join(stack[::-1]))