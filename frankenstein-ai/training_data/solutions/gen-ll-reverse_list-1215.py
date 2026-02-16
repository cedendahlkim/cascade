# Task: gen-ll-reverse_list-1215 | Score: 100% | 2026-02-12T15:41:36.444619

n = int(input())
linked_list = []
for _ in range(n):
    linked_list.append(int(input()))

linked_list.reverse()
print(*linked_list)