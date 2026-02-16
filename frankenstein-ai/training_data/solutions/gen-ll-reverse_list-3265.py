# Task: gen-ll-reverse_list-3265 | Score: 100% | 2026-02-13T20:17:34.059928

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))