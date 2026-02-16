# Task: gen-ll-reverse_list-8457 | Score: 100% | 2026-02-13T17:35:56.595943

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))