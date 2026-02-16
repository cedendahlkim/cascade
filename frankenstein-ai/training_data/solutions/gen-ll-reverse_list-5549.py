# Task: gen-ll-reverse_list-5549 | Score: 100% | 2026-02-13T21:07:47.819613

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))