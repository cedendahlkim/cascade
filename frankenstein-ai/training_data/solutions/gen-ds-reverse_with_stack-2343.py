# Task: gen-ds-reverse_with_stack-2343 | Score: 100% | 2026-02-12T16:45:20.404044

n = int(input())
linked_list = []
for _ in range(n):
    linked_list.append(input())

linked_list.reverse()
print(*linked_list)