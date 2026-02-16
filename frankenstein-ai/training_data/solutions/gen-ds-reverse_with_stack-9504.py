# Task: gen-ds-reverse_with_stack-9504 | Score: 100% | 2026-02-12T21:18:09.192483

n = int(input())
linked_list = []
for _ in range(n):
    linked_list.append(int(input()))

linked_list.reverse()
print(*linked_list)