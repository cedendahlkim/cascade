# Task: gen-ds-reverse_with_stack-1678 | Score: 100% | 2026-02-12T14:32:43.012233

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

print(' '.join(stack[::-1]))