# Task: gen-ds-reverse_with_stack-5881 | Score: 100% | 2026-02-13T18:29:33.721972

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))