# Task: gen-ll-reverse_list-5537 | Score: 100% | 2026-02-13T18:40:02.386390

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))