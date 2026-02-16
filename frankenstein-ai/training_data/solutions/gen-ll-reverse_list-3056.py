# Task: gen-ll-reverse_list-3056 | Score: 100% | 2026-02-13T15:46:29.710937

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))