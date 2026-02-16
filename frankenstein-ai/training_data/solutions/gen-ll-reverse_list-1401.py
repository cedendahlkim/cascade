# Task: gen-ll-reverse_list-1401 | Score: 100% | 2026-02-13T19:24:41.992160

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))