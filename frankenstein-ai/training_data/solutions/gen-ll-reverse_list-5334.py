# Task: gen-ll-reverse_list-5334 | Score: 100% | 2026-02-13T19:05:24.373065

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))