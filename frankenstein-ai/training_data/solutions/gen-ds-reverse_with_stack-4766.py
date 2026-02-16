# Task: gen-ds-reverse_with_stack-4766 | Score: 100% | 2026-02-12T19:12:20.639148

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

reversed_list = []
for _ in range(n):
    reversed_list.append(stack.pop())

print(*reversed_list)