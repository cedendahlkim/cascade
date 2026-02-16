# Task: gen-ds-reverse_with_stack-3194 | Score: 100% | 2026-02-12T12:17:25.679206

n = int(input())
stack = []
for _ in range(n):
    stack.append(int(input()))

print(*stack[::-1])