# Task: gen-ll-reverse_list-1843 | Score: 100% | 2026-02-12T21:18:08.721562

n = int(input())
linked_list = []
for _ in range(n):
    linked_list.append(int(input()))

linked_list.reverse()
print(*linked_list)