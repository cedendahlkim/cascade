# Task: gen-ll-reverse_list-2670 | Score: 100% | 2026-02-13T11:45:31.433861

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))