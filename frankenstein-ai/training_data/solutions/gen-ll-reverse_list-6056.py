# Task: gen-ll-reverse_list-6056 | Score: 100% | 2026-02-13T15:47:16.214541

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))