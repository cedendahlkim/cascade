# Task: gen-ll-reverse_list-5818 | Score: 100% | 2026-02-13T18:37:33.204795

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))