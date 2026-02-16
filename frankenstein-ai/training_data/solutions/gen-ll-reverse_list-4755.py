# Task: gen-ll-reverse_list-4755 | Score: 100% | 2026-02-13T13:21:55.627167

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))