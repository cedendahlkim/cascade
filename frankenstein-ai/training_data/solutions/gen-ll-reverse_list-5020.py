# Task: gen-ll-reverse_list-5020 | Score: 100% | 2026-02-12T16:41:15.314897

n = int(input())
linked_list = []
for _ in range(n):
    linked_list.append(int(input()))

linked_list.reverse()
print(*linked_list)