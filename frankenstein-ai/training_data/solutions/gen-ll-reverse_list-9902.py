# Task: gen-ll-reverse_list-9902 | Score: 100% | 2026-02-14T12:27:43.136108

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))