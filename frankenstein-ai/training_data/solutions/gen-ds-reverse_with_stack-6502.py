# Task: gen-ds-reverse_with_stack-6502 | Score: 100% | 2026-02-13T09:07:03.231042

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

print(' '.join(stack[::-1]))