# Task: gen-ds-reverse_with_stack-1560 | Score: 100% | 2026-02-12T19:51:21.162335

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

print(' '.join(stack[::-1]))