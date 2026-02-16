# Task: gen-ds-reverse_with_stack-2364 | Score: 100% | 2026-02-12T20:16:18.349061

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

print(' '.join(stack[::-1]))