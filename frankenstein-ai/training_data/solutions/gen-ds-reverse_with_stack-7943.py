# Task: gen-ds-reverse_with_stack-7943 | Score: 100% | 2026-02-13T18:20:23.782682

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))