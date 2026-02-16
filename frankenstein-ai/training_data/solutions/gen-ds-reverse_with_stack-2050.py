# Task: gen-ds-reverse_with_stack-2050 | Score: 100% | 2026-02-13T09:04:43.645527

n = int(input())
stack = []
for _ in range(n):
    stack.append(int(input()))

reversed_list = []
for _ in range(n):
    reversed_list.append(str(stack.pop()))

print(" ".join(reversed_list))