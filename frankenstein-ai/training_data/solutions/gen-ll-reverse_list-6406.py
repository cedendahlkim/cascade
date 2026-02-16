# Task: gen-ll-reverse_list-6406 | Score: 100% | 2026-02-12T17:36:30.928730

n = int(input())
linked_list = []
for _ in range(n):
    linked_list.append(input())

linked_list.reverse()
print(*linked_list)