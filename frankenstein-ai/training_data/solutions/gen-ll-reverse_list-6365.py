# Task: gen-ll-reverse_list-6365 | Score: 100% | 2026-02-13T18:24:00.557713

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))