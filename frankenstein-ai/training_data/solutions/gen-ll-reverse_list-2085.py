# Task: gen-ll-reverse_list-2085 | Score: 100% | 2026-02-12T21:18:08.940102

n = int(input())
linked_list = []
for _ in range(n):
    linked_list.append(int(input()))

linked_list.reverse()
print(*linked_list)