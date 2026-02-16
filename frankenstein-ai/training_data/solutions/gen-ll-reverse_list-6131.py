# Task: gen-ll-reverse_list-6131 | Score: 100% | 2026-02-13T18:51:31.462990

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))