# Task: gen-math-sieve_primes-5663 | Score: 100% | 2026-02-13T19:05:21.172316

def sieve_of_eratosthenes(n):
    prime = [True] * (n + 1)
    p = 2
    while (p * p <= n):
        if (prime[p] == True):
            for i in range(p * p, n + 1, p):
                prime[i] = False
        p += 1
    primes = []
    for p in range(2, n + 1):
        if prime[p]:
            primes.append(str(p))
    return " ".join(primes)

n = int(input())
print(sieve_of_eratosthenes(n))