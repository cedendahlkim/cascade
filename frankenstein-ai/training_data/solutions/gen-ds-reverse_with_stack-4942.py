# Task: gen-ds-reverse_with_stack-4942 | Score: 100% | 2026-02-12T13:29:54.020773

n = int(input())
linked_list = []
for _ in range(n):
    linked_list.append(int(input()))

linked_list.reverse()
print(*linked_list)