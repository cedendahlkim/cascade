# Task: gen-ll-reverse_list-6182 | Score: 100% | 2026-02-13T16:48:00.842639

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))