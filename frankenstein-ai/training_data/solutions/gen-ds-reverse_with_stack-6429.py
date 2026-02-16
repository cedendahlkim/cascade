# Task: gen-ds-reverse_with_stack-6429 | Score: 100% | 2026-02-12T19:11:55.094417

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

print(' '.join(stack[::-1]))