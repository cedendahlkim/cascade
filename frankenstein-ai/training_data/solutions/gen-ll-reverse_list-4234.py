# Task: gen-ll-reverse_list-4234 | Score: 100% | 2026-02-13T15:10:57.888943

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))