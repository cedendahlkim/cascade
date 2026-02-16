# Task: gen-ds-reverse_with_stack-6508 | Score: 100% | 2026-02-12T13:58:28.444825

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

reversed_list = []
for _ in range(n):
    reversed_list.append(stack.pop())

print(*reversed_list)