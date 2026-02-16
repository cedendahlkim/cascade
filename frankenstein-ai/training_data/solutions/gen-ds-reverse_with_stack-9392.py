# Task: gen-ds-reverse_with_stack-9392 | Score: 100% | 2026-02-15T07:48:26.783258

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))