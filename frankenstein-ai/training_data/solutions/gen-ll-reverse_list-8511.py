# Task: gen-ll-reverse_list-8511 | Score: 100% | 2026-02-13T16:47:11.761168

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))