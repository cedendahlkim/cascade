# Task: gen-ll-reverse_list-1611 | Score: 100% | 2026-02-13T15:10:56.177643

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))