# Task: gen-ds-reverse_with_stack-5550 | Score: 100% | 2026-02-12T19:21:30.581381

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

print(' '.join(stack[::-1]))