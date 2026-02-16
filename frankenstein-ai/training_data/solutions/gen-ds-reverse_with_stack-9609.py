# Task: gen-ds-reverse_with_stack-9609 | Score: 100% | 2026-02-12T13:58:40.562029

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

print(' '.join(stack[::-1]))